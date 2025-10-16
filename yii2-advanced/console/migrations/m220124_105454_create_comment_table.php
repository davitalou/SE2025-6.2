<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%comment}}`.
 */
class m220124_105454_create_comment_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%comment}}', [
            'id' => $this->primaryKey(),
            'title' => $this->string(length:512),
            'body' => $this->text(),
            'post_id'=> $this->integer(),
            'created_at' => $this -> integer(),
            'updated_at' => $this -> integer(),
            'created_by' => $this -> integer(),
        ]);

        $this->addForeignKey(name:'FK_comment_user_created_by', table:'{{%comment}}',columns:'created_by', refTable:'{{user}}', refColumns:'id');

        $this->addForeignKey(name:'FK_comment_post_post_id', table:'{{%comment}}',columns:'post_id', refTable:'{{%post}}', refColumns:'id');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey(name:'FK_comment_user_created_by', table:'{{%comment}}');

        $this->dropForeignKey(name:'FK_comment_post_post_id', table:'{{%comment}}');

        $this->dropTable('{{%comment}}');
    }
}
