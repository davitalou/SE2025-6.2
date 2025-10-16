<?php

use yii\db\Migration;

/**
 * Handles adding columns to table `{{%user}}`.
 */
class m220124_151658_add_access_token_column_to_user_table extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this-> addColumn(table:'{{user}}', column:'access_token', $this->string(length:512)->after(after:'auth_key'));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this-> dropColumn(table:'{{user}}', column:'access_token');
    }
}
