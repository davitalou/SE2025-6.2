<?php

use yii\db\Migration;

/**
 * Handles the creation of table `{{%post}}`.
 */
class m220124_104210_create_post_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('{{%post}}', [
            'id' => $this->primaryKey(),
            'title' => $this->string(length:512),
            'body' => 'LONGTEXT',
            'created_at' => $this -> integer(),
            'updated_at' => $this -> integer(),
            'created_by' => $this -> integer(),
        ]);

        $this->addForeignKey(name:'FK_post_user_created_by', table:'{{%post}}',columns:'created_by', refTable:'{{user}}', refColumns:'id');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropForeignKey(name:'FK_post_user_created_by', table:'{{%post}}');
        $this->dropTable('{{%post}}');
    }
}
